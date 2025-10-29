#!/usr/bin/env node

import { discoverModules, executeCommand, logWithColor } from './utils.js';
import path from 'path';
import fs from 'fs';

/**
 * Configuration for the installation process
 */
const CONFIG = {
    concurrency: 3,  // Maximum parallel installations
    verbose: false,  // Detailed logging
    force: false     // Force install all modules regardless of changes
};

/**
 * Check if module has changes since last installation
 * @param {Object} module - Module object with name and path
 * @returns {boolean} True if module has changes or can't determine
 */
function hasModuleChanges(module) {
    try {
        // Check if node_modules exists
        const nodeModulesPath = path.join(module.path, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            return true; // No node_modules, needs installation
        }

        // Get the relative path from repo root for Git operations
        const repoRoot = executeCommand('git rev-parse --show-toplevel', process.cwd(), true);
        if (!repoRoot.success) {
            // If not in a Git repo, fall back to file timestamp comparison
            const packageJsonPath = path.join(module.path, 'package.json');
            const packageJsonStat = fs.statSync(packageJsonPath);
            const nodeModulesStat = fs.statSync(nodeModulesPath);
            return packageJsonStat.mtime > nodeModulesStat.mtime;
        }

        const relativePath = path.relative(repoRoot.output.trim(), module.path);
        
        // Check for unstaged changes in package files
        const unstagedChanges = executeCommand(
            `git diff --name-only -- ${relativePath}/package.json ${relativePath}/package-lock.json`,
            process.cwd(),
            true
        );

        if (unstagedChanges.success) {
            const changedFiles = unstagedChanges.output.trim().split('\n').filter(f => f.length > 0);
            if (changedFiles.length > 0) {
                return true; // Unstaged changes in package files
            }
        }

        // Check for staged changes in package files
        const stagedChanges = executeCommand(
            `git diff --cached --name-only -- ${relativePath}/package.json ${relativePath}/package-lock.json`,
            process.cwd(),
            true
        );

        if (stagedChanges.success) {
            const changedFiles = stagedChanges.output.trim().split('\n').filter(f => f.length > 0);
            if (changedFiles.length > 0) {
                return true; // Staged changes in package files
            }
        }

        // Check if package.json or package-lock.json are newer than the last install
        // We use a marker file to track when we last installed dependencies
        const installMarkerPath = path.join(nodeModulesPath, '.install-timestamp');
        let lastInstallTime = 0;
        
        if (fs.existsSync(installMarkerPath)) {
            try {
                const markerStat = fs.statSync(installMarkerPath);
                lastInstallTime = markerStat.mtime.getTime();
            } catch (error) {
                // If we can't read the marker, assume we need to install
                return true;
            }
        }

        // Check if package.json is newer than last install
        const packageJsonPath = path.join(module.path, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJsonStat = fs.statSync(packageJsonPath);
            if (packageJsonStat.mtime.getTime() > lastInstallTime) {
                return true;
            }
        }

        // Check if package-lock.json is newer than last install
        const packageLockPath = path.join(module.path, 'package-lock.json');
        if (fs.existsSync(packageLockPath)) {
            const packageLockStat = fs.statSync(packageLockPath);
            if (packageLockStat.mtime.getTime() > lastInstallTime) {
                return true;
            }
        }

        return false; // No changes detected
    } catch (error) {
        logWithColor(`⚠️  Change detection failed for ${module.name}: ${error.message}`, 'yellow');
        return true; // Install if we can't determine changes
    }
}

/**
 * Install npm dependencies for a single module
 * @param {Object} module - Module object with name and path
 * @returns {Promise<Object>} Installation result
 */
async function installModule(module) {
    const startTime = Date.now();
    
    logWithColor(`📦 Installing dependencies for ${module.name}...`, 'cyan');
    
    try {
        const result = executeCommand('npm install', module.path, !CONFIG.verbose);
        const duration = Date.now() - startTime;
        
        if (result.success) {
            // Create timestamp marker file to track when we last installed
            try {
                const nodeModulesPath = path.join(module.path, 'node_modules');
                const installMarkerPath = path.join(nodeModulesPath, '.install-timestamp');
                fs.writeFileSync(installMarkerPath, new Date().toISOString());
            } catch (error) {
                // Don't fail the installation if we can't create the marker
                logWithColor(`⚠️  Could not create install marker for ${module.name}: ${error.message}`, 'yellow');
            }
            
            logWithColor(`✅ ${module.name} installed successfully (${duration}ms)`, 'green');
            return {
                module: module.name,
                success: true,
                duration: duration,
                error: null
            };
        } else {
            logWithColor(`❌ ${module.name} installation failed: ${result.error}`, 'red');
            return {
                module: module.name,
                success: false,
                duration: duration,
                error: result.error
            };
        }
    } catch (error) {
        const duration = Date.now() - startTime;
        logWithColor(`❌ ${module.name} installation failed: ${error.message}`, 'red');
        return {
            module: module.name,
            success: false,
            duration: duration,
            error: error.message
        };
    }
}

/**
 * Process modules in batches with concurrency control
 * @param {Array} modules - Array of modules to process
 * @param {number} concurrency - Maximum concurrent operations
 * @returns {Promise<Array>} Array of installation results
 */
async function processModulesWithConcurrency(modules, concurrency) {
    const results = [];
    
    for (let i = 0; i < modules.length; i += concurrency) {
        const batch = modules.slice(i, i + concurrency);
        logWithColor(`\n🔄 Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(modules.length / concurrency)} (${batch.map(m => m.name).join(', ')})`, 'yellow');
        
        const batchPromises = batch.map(module => installModule(module));
        const batchResults = await Promise.all(batchPromises);
        
        results.push(...batchResults);
    }
    
    return results;
}

/**
 * Display installation summary
 * @param {Array} results - Array of installation results
 * @param {Array} skippedModules - Array of skipped modules
 */
function displaySummary(results, skippedModules = []) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    
    logWithColor('\n📊 Installation Summary:', 'magenta');
    logWithColor(`   Total modules discovered: ${results.length + skippedModules.length}`, 'white');
    logWithColor(`   Installed: ${results.length}`, 'white');
    logWithColor(`   Successful: ${successful.length}`, 'green');
    logWithColor(`   Failed: ${failed.length}`, failed.length > 0 ? 'red' : 'white');
    logWithColor(`   Skipped (no changes): ${skippedModules.length}`, 'yellow');
    logWithColor(`   Total time: ${totalDuration}ms`, 'white');
    
    if (successful.length > 0) {
        logWithColor('\n✅ Successfully installed:', 'green');
        successful.forEach(result => {
            logWithColor(`   • ${result.module} (${result.duration}ms)`, 'green');
        });
    }
    
    if (failed.length > 0) {
        logWithColor('\n❌ Failed installations:', 'red');
        failed.forEach(result => {
            logWithColor(`   • ${result.module}: ${result.error}`, 'red');
        });
    }

    if (skippedModules.length > 0) {
        logWithColor('\n⏭️  Skipped modules (no changes detected):', 'yellow');
        skippedModules.forEach(module => {
            logWithColor(`   • ${module.name}`, 'yellow');
        });
    }
}

/**
 * Main installation function
 */
async function main() {
    try {
        logWithColor('🚀 Starting Lambda modules installation...', 'cyan');
        
        // Parse command line arguments
        const args = process.argv.slice(2);
        if (args.includes('--verbose')) {
            CONFIG.verbose = true;
            logWithColor('Verbose mode enabled', 'yellow');
        }

        if (args.includes('--force')) {
            CONFIG.force = true;
            logWithColor('Force mode enabled - will install all modules regardless of changes', 'yellow');
        }
        
        const concurrencyArg = args.find(arg => arg.startsWith('--concurrency='));
        if (concurrencyArg) {
            CONFIG.concurrency = parseInt(concurrencyArg.split('=')[1]) || CONFIG.concurrency;
            logWithColor(`Concurrency set to ${CONFIG.concurrency}`, 'yellow');
        }
        
        // Discover modules
        const allModules = discoverModules();
        
        if (allModules.length === 0) {
            logWithColor('❌ No Lambda modules found to install', 'red');
            process.exit(2);
        }
        
        // Filter modules that need installation
        const modulesToInstall = [];
        const skippedModules = [];
        
        if (CONFIG.force) {
            modulesToInstall.push(...allModules);
            logWithColor(`\n🔍 Force mode: Installing all ${allModules.length} modules`, 'cyan');
        } else {
            logWithColor(`\n🔍 Checking ${allModules.length} modules for changes...`, 'cyan');
            
            for (const module of allModules) {
                if (hasModuleChanges(module)) {
                    modulesToInstall.push(module);
                    logWithColor(`  📦 ${module.name}: Changes detected, will install`, 'blue');
                } else {
                    skippedModules.push(module);
                    logWithColor(`  ⏭️  ${module.name}: No changes, skipping`, 'yellow');
                }
            }
        }
        
        if (modulesToInstall.length === 0) {
            logWithColor('\n✨ No modules need installation - all dependencies are up to date!', 'green');
            displaySummary([], skippedModules);
            process.exit(0);
        }
        
        logWithColor(`\n🔧 Installing dependencies for ${modulesToInstall.length} modules with concurrency ${CONFIG.concurrency}`, 'cyan');
        
        // Install dependencies with concurrency control
        const results = await processModulesWithConcurrency(modulesToInstall, CONFIG.concurrency);
        
        // Display summary
        displaySummary(results, skippedModules);
        
        // Determine exit code
        const failedCount = results.filter(r => !r.success).length;
        if (failedCount === 0) {
            logWithColor('\n🎉 All required modules installed successfully!', 'green');
            process.exit(0);
        } else if (failedCount === results.length) {
            logWithColor('\n💥 All module installations failed!', 'red');
            process.exit(2);
        } else {
            logWithColor(`\n⚠️  ${failedCount} module(s) failed to install`, 'yellow');
            process.exit(1);
        }
        
    } catch (error) {
        logWithColor(`💥 Installation process failed: ${error.message}`, 'red');
        if (CONFIG.verbose) {
            console.error(error.stack);
        }
        process.exit(2);
    }
}

// Run the main function if this script is executed directly
main();

export {
    hasModuleChanges,
    installModule,
    processModulesWithConcurrency,
    displaySummary,
    main
};